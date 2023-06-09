/*
  Warnings:

  - You are about to drop the `GeneratedIdeas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GeneratedIdeas" DROP CONSTRAINT "GeneratedIdeas_userId_fkey";

-- DropTable
DROP TABLE "GeneratedIdeas";

-- CreateTable
CREATE TABLE "GeneratedIdea" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "GeneratedIdea_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GeneratedIdea" ADD CONSTRAINT "GeneratedIdea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
