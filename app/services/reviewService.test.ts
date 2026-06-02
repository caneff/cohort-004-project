import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";

let testDb: ReturnType<typeof createTestDb>;
let base: ReturnType<typeof seedBaseData>;

vi.mock("~/db", () => ({
  get db() {
    return testDb;
  },
}));

// Import after mock so the module picks up our test db
import {
  upsertReview,
  getUserReview,
  getCourseRatingSummary,
} from "./reviewService";

// Helper to create an additional student for multi-reviewer cases.
function makeStudent(email: string) {
  return testDb
    .insert(schema.users)
    .values({ name: email, email, role: schema.UserRole.Student })
    .returning()
    .get();
}

describe("reviewService", () => {
  beforeEach(() => {
    testDb = createTestDb();
    base = seedBaseData(testDb);
  });

  describe("upsertReview", () => {
    it("inserts a new review", () => {
      const review = upsertReview(base.user.id, base.course.id, 4);

      expect(review.userId).toBe(base.user.id);
      expect(review.courseId).toBe(base.course.id);
      expect(review.rating).toBe(4);
      expect(review.createdAt).toBeDefined();
    });

    it("updates the existing review instead of inserting a duplicate", () => {
      upsertReview(base.user.id, base.course.id, 2);
      const updated = upsertReview(base.user.id, base.course.id, 5);

      expect(updated.rating).toBe(5);

      const summary = getCourseRatingSummary(base.course.id);
      expect(summary.count).toBe(1);
      expect(summary.average).toBe(5);
    });
  });

  describe("getUserReview", () => {
    it("returns the user's review for a course", () => {
      upsertReview(base.user.id, base.course.id, 3);

      const review = getUserReview(base.user.id, base.course.id);
      expect(review?.rating).toBe(3);
    });

    it("returns undefined when the user has not reviewed the course", () => {
      expect(getUserReview(base.user.id, base.course.id)).toBeUndefined();
    });
  });

  describe("getCourseRatingSummary", () => {
    it("returns null average and zero count when there are no reviews", () => {
      const summary = getCourseRatingSummary(base.course.id);
      expect(summary.average).toBeNull();
      expect(summary.count).toBe(0);
    });

    it("averages ratings across multiple students", () => {
      const second = makeStudent("second@example.com");
      const third = makeStudent("third@example.com");

      upsertReview(base.user.id, base.course.id, 5);
      upsertReview(second.id, base.course.id, 4);
      upsertReview(third.id, base.course.id, 3);

      const summary = getCourseRatingSummary(base.course.id);
      expect(summary.count).toBe(3);
      expect(summary.average).toBeCloseTo(4);
    });

    it("does not count reviews for other courses", () => {
      const otherCourse = testDb
        .insert(schema.courses)
        .values({
          title: "Other Course",
          slug: "other-course",
          description: "Another course",
          instructorId: base.instructor.id,
          categoryId: base.category.id,
          status: schema.CourseStatus.Published,
        })
        .returning()
        .get();

      upsertReview(base.user.id, base.course.id, 5);

      const summary = getCourseRatingSummary(otherCourse.id);
      expect(summary.average).toBeNull();
      expect(summary.count).toBe(0);
    });
  });
});
