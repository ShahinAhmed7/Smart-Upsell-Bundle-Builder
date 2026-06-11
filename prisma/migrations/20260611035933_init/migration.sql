-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" DATETIME
);

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "enableFBT" BOOLEAN NOT NULL DEFAULT true,
    "enableBundles" BOOLEAN NOT NULL DEFAULT true,
    "enableVolume" BOOLEAN NOT NULL DEFAULT true,
    "enableCartUpsell" BOOLEAN NOT NULL DEFAULT false,
    "fbtTitle" TEXT NOT NULL DEFAULT 'Frequently Bought Together',
    "fbtMaxProducts" INTEGER NOT NULL DEFAULT 4,
    "fbtShowSavings" BOOLEAN NOT NULL DEFAULT true,
    "bundleTitle" TEXT NOT NULL DEFAULT 'Build Your Bundle',
    "bundleMaxItems" INTEGER NOT NULL DEFAULT 6,
    "volumeTiers" TEXT NOT NULL DEFAULT '[{"quantity":2,"discount":10},{"quantity":3,"discount":15},{"quantity":5,"discount":20}]',
    "cartUpsellTitle" TEXT NOT NULL DEFAULT 'You might also like',
    "primaryColor" TEXT NOT NULL DEFAULT '#008060',
    "textColor" TEXT NOT NULL DEFAULT '#202223',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "borderRadius" INTEGER NOT NULL DEFAULT 8,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'fixed',
    "status" TEXT NOT NULL DEFAULT 'active',
    "products" TEXT NOT NULL DEFAULT '[]',
    "minItems" INTEGER NOT NULL DEFAULT 2,
    "maxItems" INTEGER NOT NULL DEFAULT 5,
    "discountType" TEXT NOT NULL DEFAULT 'percentage',
    "discountValue" REAL NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "displayPosition" TEXT NOT NULL DEFAULT 'product_page',
    "tiers" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VolumeDiscount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "productIds" TEXT NOT NULL DEFAULT '[]',
    "collectionIds" TEXT NOT NULL DEFAULT '[]',
    "tiers" TEXT NOT NULL DEFAULT '[]',
    "title" TEXT NOT NULL DEFAULT 'Volume Discount',
    "message" TEXT NOT NULL DEFAULT 'Buy {quantity} items, get {discount}% off!',
    "showProgressBar" BOOLEAN NOT NULL DEFAULT true,
    "showBadge" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FrequentlyBoughtTogether" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "relatedProducts" TEXT NOT NULL DEFAULT '[]',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CartUpsell" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "triggerType" TEXT NOT NULL DEFAULT 'all',
    "triggerProducts" TEXT NOT NULL DEFAULT '[]',
    "upsellProducts" TEXT NOT NULL DEFAULT '[]',
    "title" TEXT NOT NULL DEFAULT 'Complete your order',
    "message" TEXT NOT NULL DEFAULT 'Add this for just $X more',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");

-- CreateIndex
CREATE INDEX "Bundle_shop_status_idx" ON "Bundle"("shop", "status");

-- CreateIndex
CREATE INDEX "VolumeDiscount_shop_status_idx" ON "VolumeDiscount"("shop", "status");

-- CreateIndex
CREATE INDEX "FrequentlyBoughtTogether_shop_idx" ON "FrequentlyBoughtTogether"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "FrequentlyBoughtTogether_shop_productId_key" ON "FrequentlyBoughtTogether"("shop", "productId");

-- CreateIndex
CREATE INDEX "CartUpsell_shop_status_idx" ON "CartUpsell"("shop", "status");
