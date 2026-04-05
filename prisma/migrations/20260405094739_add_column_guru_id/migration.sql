/*
  Warnings:

  - Added the required column `guruId` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomName` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "guruId" TEXT NOT NULL,
ADD COLUMN     "roomName" TEXT NOT NULL,
ALTER COLUMN "scheduledAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
