import { Injectable } from '@nestjs/common';
import { NoteMongoService } from './services/note-mongo.service';
import {
  Note_Type,
  Note_Create_Type,
  Note_Update_Type,
  Note_Query_Type,
  Note_ListResponse_Type,
  Note_CalendarResponse_Type,
} from './note.interface';

@Injectable()
export class NoteService {
  constructor(private readonly noteMongoService: NoteMongoService) {}

  async create(createData: Note_Create_Type): Promise<Note_Type> {
    return this.noteMongoService.create(createData);
  }

  async findById(noteId: string): Promise<Note_Type | null> {
    return this.noteMongoService.findById(noteId);
  }

  async findMany(query: Note_Query_Type): Promise<Note_ListResponse_Type> {
    return this.noteMongoService.findMany(query);
  }

  async getCalendarView(month: number, year: number): Promise<Note_CalendarResponse_Type> {
    return this.noteMongoService.getCalendarView(month, year);
  }

  async update(noteId: string, updateData: Note_Update_Type): Promise<Note_Type> {
    return this.noteMongoService.update(noteId, updateData);
  }

  async delete(noteId: string): Promise<boolean> {
    return this.noteMongoService.delete(noteId);
  }

  async toggleCompletion(noteId: string): Promise<Note_Type> {
    return this.noteMongoService.toggleCompletion(noteId);
  }
}
