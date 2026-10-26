import LeadDemo from "../demos/LeadDemo";
import BookingDemo from "../demos/BookingDemo";
import ConversationDemo from "../demos/ConversationDemo";
import WorkspaceDemo from "../demos/WorkspaceDemo";
import WorkflowDemo from "../demos/WorkflowDemo";
import MarketingDemo from "../demos/MarketingDemo";
export default function ProductExperience({ kind }: { kind: string }) {
  switch (kind) {
    case "lead":
      return <LeadDemo />;
    case "booking":
      return <BookingDemo />;
    case "receptionist":
      return <ConversationDemo initial="receptionist" />;
    case "workspace":
      return <WorkspaceDemo />;
    case "workflow":
      return <WorkflowDemo />;
    case "marketing":
      return <MarketingDemo />;
    default:
      return null;
  }
}
