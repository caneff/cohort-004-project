import { eq, and, sql } from "drizzle-orm";
import { db } from "~/db";
import { courseReviews } from "~/db/schema";

// ─── Review Service ───
// Handles student star ratings (1–5, no written text). One review per
// student per course, enforced by a composite unique index and upsert.
// Uses positional parameters (project convention).

export function getUserReview(userId: number, courseId: number) {
  return db
    .select()
    .from(courseReviews)
    .where(
      and(
        eq(courseReviews.userId, userId),
        eq(courseReviews.courseId, courseId)
      )
    )
    .get();
}

// Insert a new rating, or update the existing one (editable). Relies on the
// (user_id, course_id) unique index for conflict detection.
export function upsertReview(userId: number, courseId: number, rating: number) {
  return db
    .insert(courseReviews)
    .values({ userId, courseId, rating })
    .onConflictDoUpdate({
      target: [courseReviews.userId, courseReviews.courseId],
      set: { rating, updatedAt: new Date().toISOString() },
    })
    .returning()
    .get();
}

// Average rating + count for a course. average is null when there are no
// reviews yet (callers hide the rating display in that case).
export function getCourseRatingSummary(courseId: number): {
  average: number | null;
  count: number;
} {
  const result = db
    .select({
      average: sql<number | null>`avg(${courseReviews.rating})`,
      count: sql<number>`count(*)`,
    })
    .from(courseReviews)
    .where(eq(courseReviews.courseId, courseId))
    .get();

  return {
    average: result?.average ?? null,
    count: result?.count ?? 0,
  };
}
