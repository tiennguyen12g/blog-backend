import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Note, NoteSchema } from './note.schema';
import { NoteService } from './note.service';
import { NoteMongoService } from './services/note-mongo.service';
import { NoteController } from './note.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Note.name, schema: NoteSchema },
    ]),
    UserModule, // Import UserModule for RestrictedGuard
  ],
  providers: [NoteService, NoteMongoService],
  controllers: [NoteController],
  exports: [NoteService, NoteMongoService, MongooseModule],
})
export class NoteModule {}
