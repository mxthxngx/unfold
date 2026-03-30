import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { SpaceSidebarSkeleton } from "./space-sidebar-skeleton";
import { useNodesSuspenseQuery } from "../api/use-nodes";
import { DEFAULT_SPACE_ID } from "@/config/spaces";
import { PinnedSection2 } from "./pinned-section2";
import { NotesSection2 } from "./notes-section2";
// TODO: change this
const spaceId = DEFAULT_SPACE_ID;
export const SpaceSidebar2 = () => {
    const notes = useNodesSuspenseQuery(spaceId).data.nodes??[];
    const pinnedNodes = notes.filter(note => note.isPinned);
    return (
        <Sidebar variant="floating" collapsible="offcanvas" className="w-55 justify-center align-middle" style={{
            top: 'var(--spacing-space-sidebar-top)',
            paddingLeft: 'var(--spacing-space-sidebar-inline)',
            height: `calc(98vh - var(--spacing-space-sidebar-top))`,
        }}>
            <div className="h-3" />
            <SidebarContent className="min-h-0 gap-1">
                <SidebarGroup>
                    <SidebarGroupLabel>pinned</SidebarGroupLabel>
                    <PinnedSection2 pinnedNodes={pinnedNodes} />
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>notes</SidebarGroupLabel>
                    <NotesSection2 notes={notes} />
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
};