create table `user` (`id` varchar(36) not null primary key, `name` varchar(255) not null, `email` varchar(255) not null unique, `emailVerified` boolean not null, `image` text, `createdAt` timestamp(3) default CURRENT_TIMESTAMP(3) not null, `updatedAt` timestamp(3) default CURRENT_TIMESTAMP(3) not null, `twoFactorEnabled` boolean, `role` text not null, `active` boolean not null) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

create table `session` (`id` varchar(36) not null primary key, `expiresAt` timestamp(3) not null, `token` varchar(255) not null unique, `createdAt` timestamp(3) default CURRENT_TIMESTAMP(3) not null, `updatedAt` timestamp(3) not null, `ipAddress` text, `userAgent` text, `userId` varchar(36) not null references `user` (`id`) on delete cascade, `mfaVerified` boolean not null) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

create table `account` (`id` varchar(36) not null primary key, `accountId` text not null, `providerId` text not null, `userId` varchar(36) not null references `user` (`id`) on delete cascade, `accessToken` text, `refreshToken` text, `idToken` text, `accessTokenExpiresAt` timestamp(3), `refreshTokenExpiresAt` timestamp(3), `scope` text, `password` text, `createdAt` timestamp(3) default CURRENT_TIMESTAMP(3) not null, `updatedAt` timestamp(3) not null) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

create table `verification` (`id` varchar(36) not null primary key, `identifier` varchar(255) not null, `value` text not null, `expiresAt` timestamp(3) not null, `createdAt` timestamp(3) default CURRENT_TIMESTAMP(3) not null, `updatedAt` timestamp(3) default CURRENT_TIMESTAMP(3) not null) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

create table `twoFactor` (`id` varchar(36) not null primary key, `secret` varchar(255) not null, `backupCodes` text not null, `userId` varchar(36) not null references `user` (`id`) on delete cascade, `verified` boolean, `failedVerificationCount` integer, `lockedUntil` timestamp(3)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

create table `rateLimit` (`id` varchar(36) not null primary key, `key` varchar(255) not null unique, `count` integer not null, `lastRequest` bigint not null) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

create index `session_userId_idx` on `session` (`userId`);

create index `account_userId_idx` on `account` (`userId`);

create index `verification_identifier_idx` on `verification` (`identifier`);

create index `twoFactor_secret_idx` on `twoFactor` (`secret`);

create index `twoFactor_userId_idx` on `twoFactor` (`userId`);
