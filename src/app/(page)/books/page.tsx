"use client";

import { useState } from "react";
import OverviewBanner from "./includes/overview-banner";
import Stats from "./includes/stats";
import Toolbar from "./includes/toolbar";
import BookList from "./includes/book-list";
import AddBookModal from "./includes/add-book-modal";
import EditBookModal from "./includes/edit-book-modal";
import ManageCategoriesModal from "./includes/manage-categories-modal";
import type { Book } from "@/redux/api/booksApi";

export default function Page() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState("");

  const [isAddOpen, setAddOpen] = useState(false);
  const [isCategoriesOpen, setCategoriesOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  return (
    <div className="flex flex-col gap-7">
      <OverviewBanner onAddClick={() => setAddOpen(true)} onManageCategoriesClick={() => setCategoriesOpen(true)} />
      <Stats />
      <Toolbar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        availability={availability}
        onAvailabilityChange={setAvailability}
      />
      <BookList search={search} category={category} availability={availability} onEdit={setEditingBook} />

      {isAddOpen && <AddBookModal onClose={() => setAddOpen(false)} />}
      {isCategoriesOpen && <ManageCategoriesModal onClose={() => setCategoriesOpen(false)} />}
      {editingBook && <EditBookModal book={editingBook} onClose={() => setEditingBook(null)} />}
    </div>
  );
}
