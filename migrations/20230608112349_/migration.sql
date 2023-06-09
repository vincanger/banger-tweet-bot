/*
  Warnings:

  - The `originalTweetId` column on the `GeneratedIdea` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Tweet` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Tweet` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `originalTweetId` column on the `TweetDraft` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[userId]` on the table `Tweet` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "GeneratedIdea" DROP CONSTRAINT "GeneratedIdea_originalTweetId_fkey";

-- DropForeignKey
ALTER TABLE "TweetDraft" DROP CONSTRAINT "TweetDraft_originalTweetId_fkey";

-- AlterTable
ALTER TABLE "GeneratedIdea" DROP COLUMN "originalTweetId",
ADD COLUMN     "originalTweetId" INTEGER;

-- AlterTable
ALTER TABLE "Tweet" DROP CONSTRAINT "Tweet_pkey",
ADD COLUMN     "tweetId" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Tweet_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "TweetDraft" DROP COLUMN "originalTweetId",
ADD COLUMN     "originalTweetId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Tweet_userId_key" ON "Tweet"("userId");

-- AddForeignKey
ALTER TABLE "TweetDraft" ADD CONSTRAINT "TweetDraft_originalTweetId_fkey" FOREIGN KEY ("originalTweetId") REFERENCES "Tweet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedIdea" ADD CONSTRAINT "GeneratedIdea_originalTweetId_fkey" FOREIGN KEY ("originalTweetId") REFERENCES "Tweet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
