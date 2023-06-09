/*
  Warnings:

  - A unique constraint covering the columns `[tweetId,userId]` on the table `Tweet` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Tweet_tweetId_userId_key" ON "Tweet"("tweetId", "userId");
