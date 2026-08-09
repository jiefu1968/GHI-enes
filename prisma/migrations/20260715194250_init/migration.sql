-- CreateTable
CREATE TABLE "missionaries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "missionaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" SERIAL NOT NULL,
    "missionary_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "agent_key" TEXT,
    "module" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "urgent_flags" (
    "id" SERIAL NOT NULL,
    "missionary_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "urgent_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_messages" (
    "id" SERIAL NOT NULL,
    "missionary_id" TEXT,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_message_receipts" (
    "message_id" INTEGER NOT NULL,
    "missionary_id" TEXT NOT NULL,
    "delivered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_message_receipts_pkey" PRIMARY KEY ("message_id","missionary_id")
);

-- CreateTable
CREATE TABLE "digests" (
    "id" SERIAL NOT NULL,
    "missionary_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "digests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_log_missionary_id_idx" ON "activity_log"("missionary_id");

-- CreateIndex
CREATE INDEX "urgent_flags_missionary_id_resolved_idx" ON "urgent_flags"("missionary_id", "resolved");

-- CreateIndex
CREATE INDEX "digests_missionary_id_idx" ON "digests"("missionary_id");

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_missionary_id_fkey" FOREIGN KEY ("missionary_id") REFERENCES "missionaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "urgent_flags" ADD CONSTRAINT "urgent_flags_missionary_id_fkey" FOREIGN KEY ("missionary_id") REFERENCES "missionaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_message_receipts" ADD CONSTRAINT "mentor_message_receipts_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "mentor_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_message_receipts" ADD CONSTRAINT "mentor_message_receipts_missionary_id_fkey" FOREIGN KEY ("missionary_id") REFERENCES "missionaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digests" ADD CONSTRAINT "digests_missionary_id_fkey" FOREIGN KEY ("missionary_id") REFERENCES "missionaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
