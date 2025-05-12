
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Info } from "lucide-react";

interface RcDetailsProps {
  id?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

const RcDetails: React.FC<RcDetailsProps> = ({
  id = "Not available",
  status = "Unknown",
  createdAt = "Not available",
  updatedAt = "Not available"
}) => {
  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          RC Details
          <HoverCard>
            <HoverCardTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Resource Configuration Details</h4>
                <p className="text-sm">
                  This card displays information about the resource configuration including its ID, 
                  status, and relevant timestamps.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1">
            <span className="text-sm font-medium">ID:</span>
            <span className="text-sm">{id}</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <span className="text-sm font-medium">Status:</span>
            <span className="text-sm">{status}</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <span className="text-sm font-medium">Created:</span>
            <span className="text-sm">{createdAt}</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <span className="text-sm font-medium">Updated:</span>
            <span className="text-sm">{updatedAt}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RcDetails;
