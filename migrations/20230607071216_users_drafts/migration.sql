/*
  Warnings:

  - Added the required column `userId` to the `TweetDraft` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TweetDraft" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "TweetDraft" ADD CONSTRAINT "TweetDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
