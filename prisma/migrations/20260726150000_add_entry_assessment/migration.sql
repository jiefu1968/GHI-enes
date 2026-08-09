-- CreateTable
CREATE TABLE "entry_assessments" (
    "id" SERIAL NOT NULL,
    "missionary_id" TEXT NOT NULL,
    "foundations_score" INTEGER NOT NULL,
    "formation_score" INTEGER NOT NULL,
    "intercultural_score" INTEGER NOT NULL,
    "strategy_score" INTEGER NOT NULL,
    "evangelism_score" INTEGER NOT NULL,
    "total_score" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entry_assessments_missionary_id_key" ON "entry_assessments"("missionary_id");

-- AddForeignKey
ALTER TABLE "entry_assessments" ADD CONSTRAINT "entry_assessments_missionary_id_fkey" FOREIGN KEY ("missionary_id") REFERENCES "missionaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
