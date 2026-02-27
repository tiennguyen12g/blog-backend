import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RestrictedGuard } from '../../auth/restricted.guard';
import { NoteService } from './note.service';
import { JwtUserPayload } from '../user/user.interface';
import { ZodValidationPipe } from '../../validation.pipe';
import { handleRequest } from '../../global/handleRequest';
import { ResponseDataOutput, ResponseDataWhenError } from '../../global/GlobalResponseData';
import {
  Note_Type,
  Note_Create_Type,
  Note_Update_Type,
  Note_Query_Type,
  Note_ListResponse_Type,
  Note_CalendarResponse_Type,
  Note_Create_Schema,
  Note_Update_Schema,
  Note_Query_Schema,
} from './note.interface';

@Controller('api/v1/notes')
@UseGuards(JwtAuthGuard, RestrictedGuard)
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  /**
   * Create a new note
   */
  @Post()
  async create(
    @Request() req: { user: JwtUserPayload },
    @Body(new ZodValidationPipe({ schema: Note_Create_Schema, action: 'createNote' }))
    createData: Note_Create_Type,
  ): Promise<ResponseDataOutput<Note_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }
    return handleRequest<Note_Type>({
      execute: () => this.noteService.create(req.user.user_id, createData),
      actionName: 'createNote',
    });
  }

  /**
   * Get notes with pagination and filters
   */
  @Get()
  async findMany(
    @Request() req: { user: JwtUserPayload },
    @Query(new ZodValidationPipe({ schema: Note_Query_Schema, action: 'getNotes' }))
    query: Note_Query_Type,
  ): Promise<ResponseDataOutput<Note_ListResponse_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }
    console.log(`🔵 [NoteController] Getting notes for userId: ${req.user.user_id}`);
    return handleRequest<Note_ListResponse_Type>({
      execute: () => this.noteService.findMany(req.user.user_id, query),
      actionName: 'getNotes',
    });
  }

  /**
   * Get calendar view for a specific month/year
   */
  @Get('calendar')
  async getCalendarView(
    @Request() req: { user: JwtUserPayload },
    @Query('month') month: string,
    @Query('year') year: string,
  ): Promise<ResponseDataOutput<Note_CalendarResponse_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (!monthNum || !yearNum || monthNum < 1 || monthNum > 12) {
      return handleRequest<Note_CalendarResponse_Type>({
        execute: async () => {
          throw new Error('Invalid month or year. Month must be 1-12, year must be valid.');
        },
        actionName: 'getCalendarView',
      });
    }

    return handleRequest<Note_CalendarResponse_Type>({
      execute: () => this.noteService.getCalendarView(req.user.user_id, monthNum, yearNum),
      actionName: 'getCalendarView',
    });
  }

  /**
   * Get note by ID
   */
  @Get(':id')
  async findById(
    @Request() req: { user: JwtUserPayload },
    @Param('id') id: string,
  ): Promise<ResponseDataOutput<Note_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }
    return handleRequest<Note_Type>({
      execute: () => this.noteService.findById(id, req.user.user_id),
      actionName: 'getNote',
    });
  }

  /**
   * Update note
   */
  @Put(':id')
  async update(
    @Request() req: { user: JwtUserPayload },
    @Param('id') id: string,
    @Body(new ZodValidationPipe({ schema: Note_Update_Schema, action: 'updateNote' }))
    updateData: Note_Update_Type,
  ): Promise<ResponseDataOutput<Note_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }
    return handleRequest<Note_Type>({
      execute: () => this.noteService.update(id, req.user.user_id, updateData),
      actionName: 'updateNote',
    });
  }

  /**
   * Toggle completion status
   */
  @Put(':id/toggle-completion')
  async toggleCompletion(
    @Request() req: { user: JwtUserPayload },
    @Param('id') id: string,
  ): Promise<ResponseDataOutput<Note_Type | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }
    return handleRequest<Note_Type>({
      execute: () => this.noteService.toggleCompletion(id, req.user.user_id),
      actionName: 'toggleNoteCompletion',
    });
  }

  /**
   * Delete note
   */
  @Delete(':id')
  async delete(
    @Request() req: { user: JwtUserPayload },
    @Param('id') id: string,
  ): Promise<ResponseDataOutput<{ success: boolean } | ResponseDataWhenError>> {
    if (!req.user || !req.user.user_id) {
      throw new Error('User not authenticated');
    }
    return handleRequest<{ success: boolean }>({
      execute: async () => {
        const success = await this.noteService.delete(id, req.user.user_id);
        return { success };
      },
      actionName: 'deleteNote',
    });
  }
}
