
import { useState } from "react";
import { MoreHorizontal, Edit, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ActionsDropdownProps {
  onEdit?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDelete?: () => void;
  isArchived?: boolean;
}

export const ActionsDropdown = ({ 
  onEdit, 
  onArchive, 
  onUnarchive, 
  onDelete, 
  isArchived = false 
}: ActionsDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="touch-target text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal size={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border-border">
        {onEdit && (
          <DropdownMenuItem onClick={onEdit} className="hover:bg-accent">
            <Edit size={16} className="mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        
        {isArchived ? (
          onUnarchive && (
            <DropdownMenuItem onClick={onUnarchive} className="hover:bg-accent">
              <ArchiveRestore size={16} className="mr-2" />
              Unarchive
            </DropdownMenuItem>
          )
        ) : (
          onArchive && (
            <DropdownMenuItem onClick={onArchive} className="hover:bg-accent">
              <Archive size={16} className="mr-2" />
              Archive
            </DropdownMenuItem>
          )
        )}
        
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDelete} 
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
