import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Note, NoteDocument } from '../note.schema';
import {
  Note_Type,
  Note_Create_Type,
  Note_Update_Type,
  Note_Query_Type,
  Note_ListResponse_Type,
  Note_CalendarResponse_Type,
} from '../note.interface';

@Injectable()
export class NoteMongoService {
  constructor(
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
  ) {}

  /**
   * Convert MongoDB document to Note_Type
   */
  private toNoteType(note: any): Note_Type {
    return {
      _id: note._id?.toString(),
      title: note.title,
      description: note.description,
      type: note.type,
      date: note.date,
      endDate: note.endDate,
      isCompleted: note.isCompleted,
      completedAt: note.completedAt,
      result: note.result,
      priority: note.priority,
      tags: note.tags || [],
      isRecurring: note.isRecurring || false,
      recurringPattern: note.recurringPattern,
      location: note.location,
      attachments: note.attachments || [],
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }

  /**
   * Create a new note
   */
  async create(createData: Note_Create_Type): Promise<Note_Type> {
    const newNote = new this.noteModel({
      ...createData,
      date: createData.date || new Date(),
      isCompleted: createData.isCompleted || false,
      priority: createData.priority || 'medium',
    });

    const savedNote = await newNote.save();
    return this.toNoteType(savedNote);
  }

  /**
   * Find note by ID
   */
  async findById(noteId: string): Promise<Note_Type | null> {
    const note = await this.noteModel.findById(noteId).lean();
    if (!note) return null;
    return this.toNoteType(note);
  }

  /**
   * Find notes with pagination and filters
   */
  async findMany(query: Note_Query_Type): Promise<Note_ListResponse_Type> {
    const {
      page = 1,
      limit = 50,
      type,
      priority,
      isCompleted,
      startDate,
      endDate,
      month,
      year,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      includeRecurring = true,
    } = query;

    // Build filter
    const filter: any = {};

    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (isCompleted !== undefined) filter.isCompleted = isCompleted;

    // Date filtering
    if (month && year) {
      // Filter by specific month/year
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      filter.$or = [
        { date: { $gte: start, $lte: end } },
        { endDate: { $gte: start, $lte: end } },
        { $and: [{ date: { $lte: start } }, { endDate: { $gte: end } }] }, // Events that span the month
      ];
    } else if (startDate || endDate) {
      // Date range filtering
      if (startDate && endDate) {
        filter.$or = [
          { date: { $gte: new Date(startDate), $lte: new Date(endDate) } },
          { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
          { $and: [{ date: { $lte: new Date(startDate) } }, { endDate: { $gte: new Date(endDate) } }] },
        ];
      } else if (startDate) {
        filter.$or = [
          { date: { $gte: new Date(startDate) } },
          { endDate: { $gte: new Date(startDate) } },
        ];
      } else if (endDate) {
        filter.$or = [
          { date: { $lte: new Date(endDate) } },
          { endDate: { $lte: new Date(endDate) } },
        ];
      }
    }

    // Include recurring events
    if (!includeRecurring) {
      filter.isRecurring = false;
    }

    // Search in title, description, result
    if (search) {
      filter.$or = [
        ...(filter.$or || []),
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { result: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    const [notes, total] = await Promise.all([
      this.noteModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      this.noteModel.countDocuments(filter),
    ]);

    return {
      notes: notes.map(n => this.toNoteType(n)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get calendar view - notes grouped by date
   */
  async getCalendarView(month: number, year: number): Promise<Note_CalendarResponse_Type> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const filter: any = {
      $or: [
        { date: { $gte: start, $lte: end } },
        { endDate: { $gte: start, $lte: end } },
        { $and: [{ date: { $lte: start } }, { endDate: { $gte: end } }] },
      ],
    };

    const notes = await this.noteModel.find(filter).sort({ date: 1 }).lean();

    // Group notes by date
    const calendar: Note_CalendarResponse_Type = {};

    notes.forEach((note) => {
      const noteData = this.toNoteType(note);
      const startDate = new Date(note.date);
      const endDate = note.endDate ? new Date(note.endDate) : startDate;

      // Add note to all dates it spans
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Use local date formatting to avoid timezone issues
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`; // YYYY-MM-DD in local timezone
        if (!calendar[dateKey]) {
          calendar[dateKey] = [];
        }
        calendar[dateKey].push(noteData);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return calendar;
  }

  /**
   * Update note
   */
  async update(noteId: string, updateData: Note_Update_Type): Promise<Note_Type> {
    const note = await this.noteModel.findById(noteId);
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // If marking as completed, set completedAt
    if (updateData.isCompleted && !note.isCompleted) {
      updateData.completedAt = new Date();
    } else if (updateData.isCompleted === false) {
      updateData.completedAt = undefined;
    }

    Object.assign(note, updateData);
    const updatedNote = await note.save();
    return this.toNoteType(updatedNote);
  }

  /**
   * Delete note
   */
  async delete(noteId: string): Promise<boolean> {
    const result = await this.noteModel.findByIdAndDelete(noteId);
    return !!result;
  }

  /**
   * Toggle completion status
   */
  async toggleCompletion(noteId: string): Promise<Note_Type> {
    const note = await this.noteModel.findById(noteId);
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    note.isCompleted = !note.isCompleted;
    note.completedAt = note.isCompleted ? new Date() : undefined;

    const updatedNote = await note.save();
    return this.toNoteType(updatedNote);
  }
}
