import { FlatNodeDto } from "@/api/nodes";
import { SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

interface PinnedSectionProps{
    pinnedNodes: FlatNodeDto[];
}
export const PinnedSection2 = ({pinnedNodes}: PinnedSectionProps) => {
    return (
     <>
      <SidebarGroupContent>
        <div>
            <SidebarMenu>
                {pinnedNodes.map(node => (
                    <SidebarMenuItem key={node.id}>
                        <SidebarMenuButton>{node.name}</SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </div>
      </SidebarGroupContent>
     </>
    );
};