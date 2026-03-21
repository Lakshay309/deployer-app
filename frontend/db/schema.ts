import { pgTable, text, boolean, timestamp, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
    id:            uuid('id').primaryKey().defaultRandom(),
    email:         text('email').unique().notNull(),
    username:      text('username').unique().notNull(),
    // name:          text('name'),
    passwordHash:  text('password_hash'),
    googleId:      text('google_id').unique(),
    isVerified:    boolean('is_verified').default(false),
    verifyToken:   text('verify_token'),
    verifyExpires: timestamp('verify_expires'),
    resetToken:    text('reset_token'),
    resetExpires:  timestamp('reset_expires'),
    createdAt:     timestamp('created_at').defaultNow(),
})

export const betaEmails = pgTable('beta_emails', {
    id:      uuid('id').primaryKey().defaultRandom(),
    email:   text('email').unique().notNull(),
    addedAt: timestamp('added_at').defaultNow(),
})

export const projects = pgTable('projects', {
    id:          uuid('id').primaryKey().defaultRandom(),
    userId:      uuid('user_id').notNull().references(() => users.id),
    name:        text('name').notNull(),
    repoUrl:     text('repo_url').notNull(),
    deployedUrl: text('deployed_url'),
    status:      text('status').default('idle'),
    createdAt:   timestamp('created_at').defaultNow(),
})

export const deployments = pgTable('deployments', {
    id:         uuid('id').primaryKey().defaultRandom(),
    projectId:  uuid('project_id').notNull().references(() => projects.id),
    taskId:     text('task_id'),
    status:     text('status').default('pending'),
    createdAt:  timestamp('created_at').defaultNow(),
    finishedAt: timestamp('finished_at'),
})