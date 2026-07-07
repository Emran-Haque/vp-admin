import OverviewHeader from "./includes/overview-header";
import Stats from "./includes/stats";
import Toolbar from "./includes/toolbar";
import ResultsTable from "./includes/results-table";
import Pagination from "./includes/pagination";

export default function Page() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-fuchsia-500" />

      <div className="flex flex-col gap-5 p-5">
        <OverviewHeader />
        <Stats />

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-gray-900 shadow-[0px_3px_14px_0px_rgba(0,0,0,0.30)]">
          <Toolbar />
          <ResultsTable />
          <Pagination />
        </div>
      </div>
    </div>
  );
}
