-- AlterEnum: add PENDING_CONFIRMATION to AttendeeStatus
ALTER TYPE "AttendeeStatus" ADD VALUE 'PENDING_CONFIRMATION';

-- AlterTable: add confirmationToken and expiresAt to EventAttendee, change default status
ALTER TABLE "EventAttendee"
  ADD COLUMN "confirmationToken" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ALTER COLUMN "status" SET DEFAULT 'PENDING_CONFIRMATION';

-- Update existing records to keep CONFIRMED status (they were already confirmed before this feature)
UPDATE "EventAttendee" SET "status" = 'CONFIRMED' WHERE "status" = 'CONFIRMED';

-- CreateIndex: unique confirmationToken
CREATE UNIQUE INDEX "EventAttendee_confirmationToken_key" ON "EventAttendee"("confirmationToken");

-- CreateTable: EventOccurrenceProfessional
CREATE TABLE "EventOccurrenceProfessional" (
    "id" TEXT NOT NULL,
    "occurrenceId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "googleCalendarEventId" TEXT,

    CONSTRAINT "EventOccurrenceProfessional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique per occurrence+professional
CREATE UNIQUE INDEX "EventOccurrenceProfessional_occurrenceId_professionalId_key" ON "EventOccurrenceProfessional"("occurrenceId", "professionalId");

-- CreateTable: implicit M2M for Event <-> User (professionals)
CREATE TABLE "_EventProfessionals" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventProfessionals_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX "_EventProfessionals_B_index" ON "_EventProfessionals"("B");

-- AddForeignKey: EventOccurrenceProfessional
ALTER TABLE "EventOccurrenceProfessional"
  ADD CONSTRAINT "EventOccurrenceProfessional_occurrenceId_fkey"
  FOREIGN KEY ("occurrenceId") REFERENCES "EventOccurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventOccurrenceProfessional"
  ADD CONSTRAINT "EventOccurrenceProfessional_professionalId_fkey"
  FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: _EventProfessionals
ALTER TABLE "_EventProfessionals"
  ADD CONSTRAINT "_EventProfessionals_A_fkey"
  FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_EventProfessionals"
  ADD CONSTRAINT "_EventProfessionals_B_fkey"
  FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
