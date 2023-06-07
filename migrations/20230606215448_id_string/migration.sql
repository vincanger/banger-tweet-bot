/*
  Warnings:

  - The primary key for the `Tweet` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "TweetDraft" DROP CONSTRAINT "TweetDraft_originalTweetId_fkey";

-- AlterTable
ALTER TABLE "Tweet" DROP CONSTRAINT "Tweet_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Tweet_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "TweetDraft" ALTER COLUMN "originalTweetId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "TweetDraft" ADD CONSTRAINT "TweetDraft_originalTweetId_fkey" FOREIGN KEY ("originalTweetId") REFERENCES "Tweet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
