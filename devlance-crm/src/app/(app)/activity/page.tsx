import { getActivities } from "@/lib/data";
import { ActivityView } from "@/components/features/activity-view";

export default async function ActivityPage() {
  const activities = await getActivities({ limit: 100 });
  return <ActivityView activities={activities} />;
}