/*
  Warnings:

  - Made the column `originalTweetId` on table `GeneratedIdea` required. This step will fail if there are existing NULL values in that column.
  - Made the column `notes` on table `TweetDraft` required. This step will fail if there are existing NULL values in that column.
  - Made the column `originalTweetId` on table `TweetDraft` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "GeneratedIdea" DROP CONSTRAINT "GeneratedIdea_originalTweetId_fkey";

-- DropForeignKey
ALTER TABLE "TweetDraft" DROP CONSTRAINT "TweetDraft_originalTweetId_fkey";

-- AlterTable
ALTER TABLE "GeneratedIdea" ALTER COLUMN "originalTweetId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TweetDraft" ALTER COLUMN "notes" SET NOT NULL,
ALTER COLUMN "originalTweetId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "TweetDraft" ADD CONSTRAINT "TweetDraft_originalTweetId_fkey" FOREIGN KEY ("originalTweetId") REFERENCES "Tweet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedIdea" ADD CONSTRAINT "GeneratedIdea_originalTweetId_fkey" FOREIGN KEY ("originalTweetId") REFERENCES "Tweet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
