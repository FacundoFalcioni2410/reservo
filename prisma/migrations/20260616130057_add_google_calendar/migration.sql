-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "googleCalendarEventId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleAccessToken" TEXT,
ADD COLUMN     "googleRefreshToken" TEXT;
