-- DropForeignKey
ALTER TABLE "GeneratedIdea" DROP CONSTRAINT "GeneratedIdea_originalTweetId_fkey";

-- AlterTable
ALTER TABLE "GeneratedIdea" ALTER COLUMN "originalTweetId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "GeneratedIdea" ADD CONSTRAINT "GeneratedIdea_originalTweetId_fkey" FOREIGN KEY ("originalTweetId") REFERENCES "Tweet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
