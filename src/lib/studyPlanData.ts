import { StudyPlanDay, TaskTemplate, TaskType } from '../types';
import { addDays, getDay, startOfDay } from 'date-fns';

export const generateMasterPlan = (startDateStr: string, includeSundays: boolean = false): StudyPlanDay[] => {
  const plan: StudyPlanDay[] = [];
  let testCounter = 1;
  
  // Parse date string manually to avoid timezone shifts (ensures local midnight)
  const [year, month, dayPart] = startDateStr.split('T')[0].split('-').map(Number);
  const startDate = new Date(year, month - 1, dayPart);

  for (let day = 1; day <= 180; day++) {
    const tasks: TaskTemplate[] = [];
    const currentDate = addDays(startDate, day - 1);
    const dayOfWeek = getDay(currentDate); // 0 = Sun, 1 = Mon, ..., 6 = Sat

    // --- Story Logic ---
    let level = 1;
    let storyNum = day;

    if (day <= 75) {
      if (day > 20 && day <= 37) {
        level = 2;
        storyNum = day - 20;
      } else if (day > 37 && day <= 60) {
        level = 3;
        storyNum = day - 37;
      } else if (day > 60) {
        level = 4;
        storyNum = day - 60;
      }
    } else if (day <= 115) {
      level = 5;
      storyNum = Math.ceil((day - 75) / 1.5);
      if (day > 95) {
        level = 6;
        storyNum = Math.ceil((day - 95) / 1.5);
      }
    } else if (day <= 155) {
      level = 7;
      storyNum = day - 115;
      if (day > 135) {
        level = 8;
        storyNum = day - 135;
      }
    } else {
      level = 8;
      storyNum = 1; // Review mode
    }

    // Add Story Task (Mon-Sat, or Mon-Sun if includeSundays is true)
    if (includeSundays || dayOfWeek !== 0) { 
      const isReview = dayOfWeek === 3 || day >= 156; // Wed is 3
      tasks.push({
        id: `story-l${level}-${storyNum}-${day}`,
        type: "story",
        title: isReview ? `Review Story: Level ${level} - Story ${storyNum}` : `New Story: Level ${level} - Story ${storyNum}`,
        description: isReview 
          ? "Pronunciation focus: Record yourself summarizing story in French (2 mins). Upload to AmiGrade for AI feedback."
          : "Listen Modern Speed (No text)|Listen Enunciated Speed (Write phonetic sounds)|Check Transcript ONLY for missed words|Shadow reading x3",
        resourceLink: "https://www.frenchtoday.com/"
      });
    }

    // --- TCF Logic ---
    if (dayOfWeek === 0) {
      if (includeSundays) {
        tasks.push({
          id: `tcf-sunday-drill-${day}`,
          type: "tcf_drill",
          title: "Sunday Mastery Drill",
          description: "Review any weak areas from the week. Focus on Vocabulary or Grammar drills. Explain why wrong options are wrong.",
          resourceLink: "https://fuck-tcf.xyz/"
        });
      }
    } else if (day <= 120) {
      if (dayOfWeek === 1 || dayOfWeek === 4) { // Mon, Thu: New Test
        if (testCounter <= 40) {
          tasks.push({
            id: `tcf-test-${testCounter}-${day}`,
            type: "tcf_new",
            testId: testCounter,
            title: `TCF Test ${testCounter} (First Attempt)`,
            description: "Open Test. Time yourself. Do NOT stop to look up words. Guess if you must. Log final score /39.",
            resourceLink: `https://fuck-tcf.xyz/test-${testCounter}`
          });
          testCounter++;
        }
      } else if (dayOfWeek === 2 || dayOfWeek === 5) { // Tue, Fri: Analyze Errors
        const currentTest = testCounter - 1;
        if (currentTest > 0) {
          tasks.push({
            id: `tcf-analyze-${currentTest}-${day}`,
            type: "tcf_drill",
            testId: currentTest,
            title: `Analyze Test ${currentTest} Errors`,
            description: "Review incorrect Qs only. Click link to fuck-tcf.xyz and re-read only the questions you missed. Write down 1 grammar rule you learned.",
            resourceLink: `https://fuck-tcf.xyz/test-${currentTest}`
          });
        }
      } else if (dayOfWeek === 3) { // Wed: Section Drill
        tasks.push({
          id: `tcf-drill-${day}`,
          type: "tcf_drill",
          title: "TCF Section Drill",
          description: "Listening Section only from the NEXT test. Focus on speed and pattern recognition.",
          resourceLink: "https://fuck-tcf.xyz/"
        });
      } else if (dayOfWeek === 6) { // Sat: Review Mechanism
        tasks.push({
          id: `tcf-review-sat-${day}`,
          type: "tcf_review",
          title: "Re-Take Lowest Score Test",
          description: "Identify your lowest score test from the past 2 weeks and re-take it. Aim for 35/39. Use AmiGrade workflow: explain why other options are wrong.",
          resourceLink: "https://fuck-tcf.xyz/"
        });
      }
    } else {
      // Phase 3: Mastery & Polish (Days 121-180)
      if (day === 145) {
        tasks.push({
          id: `tcf-sprint-1-10`,
          type: "tcf_review",
          title: "TCF Final Sprint: Retake Tests 1-10",
          description: "Retake tests 1-10. Focus on those with lowest scores. Aim for 39/39.",
          resourceLink: "https://fuck-tcf.xyz/"
        });
      } else if (day === 160) {
        tasks.push({
          id: `tcf-sprint-11-20`,
          type: "tcf_review",
          title: "TCF Final Sprint: Retake Tests 11-20",
          description: "Retake tests 11-20. Focus on those with lowest scores. Aim for 39/39.",
          resourceLink: "https://fuck-tcf.xyz/"
        });
      } else if (day === 175) {
        tasks.push({
          id: `tcf-final-mock`,
          type: "tcf_new",
          testId: 40,
          title: "Full Mock Exam: Test 40",
          description: "Do Test 40 WITHOUT looking at the clock. Aim for 39/39. Say correct answers out loud in full sentences.",
          resourceLink: "https://fuck-tcf.xyz/test-40"
        });
      } else if (dayOfWeek !== 0 || includeSundays) {
        tasks.push({
          id: `tcf-mastery-${day}`,
          type: "tcf_review",
          title: "TCF Mastery Drill",
          description: "Pick any test < 35/39 and master it. Explain why wrong options are wrong.",
          resourceLink: "https://fuck-tcf.xyz/"
        });
      }
    }

    plan.push({
      day,
      dateOffset: day - 1,
      tasks
    });
  }

  return plan;
};
