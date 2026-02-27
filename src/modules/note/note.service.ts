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

  async create(userId: string, createData: Note_Create_Type): Promise<Note_Type> {
    return this.noteMongoService.create(userId, createData);
  }

  async findById(noteId: string, userId: string): Promise<Note_Type | null> {
    return this.noteMongoService.findById(noteId, userId);
  }

  async findMany(userId: string, query: Note_Query_Type): Promise<Note_ListResponse_Type> {
    return this.noteMongoService.findMany(userId, query);
  }

  async getCalendarView(userId: string, month: number, year: number): Promise<Note_CalendarResponse_Type> {
    return this.noteMongoService.getCalendarView(userId, month, year);
  }

  async update(noteId: string, userId: string, updateData: Note_Update_Type): Promise<Note_Type> {
    return this.noteMongoService.update(noteId, userId, updateData);
  }

  async delete(noteId: string, userId: string): Promise<boolean> {
    return this.noteMongoService.delete(noteId, userId);
  }

  async toggleCompletion(noteId: string, userId: string): Promise<Note_Type> {
    return this.noteMongoService.toggleCompletion(noteId, userId);
  }
}
