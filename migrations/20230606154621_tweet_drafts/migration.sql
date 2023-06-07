-- CreateTable
CREATE TABLE "TweetDraft" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "originalTweetId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TweetDraft_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TweetDraft" ADD CONSTRAINT "TweetDraft_originalTweetId_fkey" FOREIGN KEY ("originalTweetId") REFERENCES "Tweet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
