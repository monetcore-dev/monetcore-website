import ConversationDemo from "../demos/ConversationDemo";
import WorkspaceDemo from "../demos/WorkspaceDemo";
import WorkflowDemo from "../demos/WorkflowDemo";
import WebsiteDemo from "../demos/WebsiteDemo";
import MobileDemo from "../demos/MobileDemo";
import MarketingDemo from "../demos/MarketingDemo";
import AssessmentDemo from "../demos/AssessmentDemo";
export default function ServiceExperience({ kind }: { kind: string }) {
  switch (kind) {
    case "ai":
      return <ConversationDemo />;
    case "workspace":
      return <WorkspaceDemo />;
    case "workflow":
      return <WorkflowDemo />;
    case "website":
      return <WebsiteDemo />;
    case "mobile":
      return <MobileDemo />;
    case "marketing":
      return <MarketingDemo />;
    case "assessment":
      return <AssessmentDemo />;
    default:
      return null;
  }
}
