-- AlterTable
ALTER TABLE "GeneratedIdea" ADD COLUMN     "originalTweetId" TEXT;

-- AddForeignKey
ALTER TABLE "GeneratedIdea" ADD CONSTRAINT "GeneratedIdea_originalTweetId_fkey" FOREIGN KEY ("originalTweetId") REFERENCES "Tweet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
