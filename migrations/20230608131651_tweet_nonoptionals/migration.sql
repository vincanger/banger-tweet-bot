/*
  Warnings:

  - Made the column `userId` on table `Tweet` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tweetId` on table `Tweet` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Tweet" DROP CONSTRAINT "Tweet_userId_fkey";

-- AlterTable
ALTER TABLE "Tweet" ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "tweetId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
