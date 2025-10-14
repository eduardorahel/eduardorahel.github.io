-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'ANALYST');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('NATURAL', 'LEGAL');

-- CreateEnum
CREATE TYPE "ColumnType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'DATETIME', 'JSON');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ANALYST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "type" "PersonType" NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "customJson" JSONB,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "primaryKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatasetColumn" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataType" "ColumnType" NOT NULL,
    "isNullable" BOOLEAN NOT NULL DEFAULT true,
    "isUnique" BOOLEAN NOT NULL DEFAULT false,
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "maskPattern" TEXT,

    CONSTRAINT "DatasetColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatasetRelation" (
    "id" TEXT NOT NULL,
    "fromDatasetId" TEXT NOT NULL,
    "toDatasetId" TEXT NOT NULL,
    "fromColumn" TEXT NOT NULL,
    "toColumn" TEXT NOT NULL,
    "cardinality" "RelationshipType" NOT NULL DEFAULT 'MANY_TO_ONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatasetRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Person_ownerId_idx" ON "Person"("ownerId");

-- CreateIndex
CREATE INDEX "Person_document_idx" ON "Person"("document");

-- CreateIndex
CREATE INDEX "ImportLog_ownerId_idx" ON "ImportLog"("ownerId");

-- CreateIndex
CREATE INDEX "Dataset_ownerId_idx" ON "Dataset"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Dataset_ownerId_tableName_key" ON "Dataset"("ownerId", "tableName");

-- CreateIndex
CREATE INDEX "DatasetColumn_datasetId_idx" ON "DatasetColumn"("datasetId");

-- CreateIndex
CREATE UNIQUE INDEX "DatasetColumn_datasetId_name_key" ON "DatasetColumn"("datasetId", "name");

-- CreateIndex
CREATE INDEX "DatasetRelation_fromDatasetId_idx" ON "DatasetRelation"("fromDatasetId");

-- CreateIndex
CREATE INDEX "DatasetRelation_toDatasetId_idx" ON "DatasetRelation"("toDatasetId");

-- CreateIndex
CREATE INDEX "AccessLog_userId_idx" ON "AccessLog"("userId");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportLog" ADD CONSTRAINT "ImportLog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dataset" ADD CONSTRAINT "Dataset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatasetColumn" ADD CONSTRAINT "DatasetColumn_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatasetRelation" ADD CONSTRAINT "DatasetRelation_fromDatasetId_fkey" FOREIGN KEY ("fromDatasetId") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatasetRelation" ADD CONSTRAINT "DatasetRelation_toDatasetId_fkey" FOREIGN KEY ("toDatasetId") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

