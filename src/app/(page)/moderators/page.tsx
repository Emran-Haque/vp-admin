"use client";

import { useState } from "react";
import OverviewBanner from "./includes/overview-banner";
import Stats from "./includes/stats";
import Toolbar from "./includes/toolbar";
import ModeratorList from "./includes/moderator-list";
import AddModeratorModal from "./includes/add-moderator-modal";
import PermissionsModal from "./includes/permissions-modal";
import type { Moderator } from "@/redux/api/moderatorsApi";

export default function Page() {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [permissionsFor, setPermissionsFor] = useState<Moderator | null>(null);
  const [notice, setNotice] = useState("");

  return (
    <div className="flex flex-col gap-7">
      <OverviewBanner onAddClick={() => setShowAddModal(true)} />
      {notice ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
          {notice}
        </div>
      ) : null}
      <Stats />
      <Toolbar search={search} onSearchChange={setSearch} />
      <ModeratorList search={search} onManagePermissions={setPermissionsFor} />

      {showAddModal && (
        <AddModeratorModal
          onClose={() => setShowAddModal(false)}
          onCompleted={(moderator, message) => {
            setShowAddModal(false);
            setNotice(message);
            setPermissionsFor(moderator);
          }}
        />
      )}
      {permissionsFor && (
        <PermissionsModal moderator={permissionsFor} onClose={() => setPermissionsFor(null)} />
      )}
    </div>
  );
}
