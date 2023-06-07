-- CreateTable
CREATE TABLE "GeneratedIdeas" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "GeneratedIdeas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GeneratedIdeas" ADD CONSTRAINT "GeneratedIdeas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
