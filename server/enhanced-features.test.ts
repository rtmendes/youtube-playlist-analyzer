import { describe, it, expect } from "vitest";

// Test global search filtering logic
describe("Global Search", () => {
  const mockProjects = [
    { id: 1, name: "Marketing Campaign", description: "Q1 campaign analysis" },
    { id: 2, name: "Product Launch", description: "New product feedback" },
    { id: 3, name: "Customer Research", description: "User interviews" },
  ];

  const mockFolders = [
    { id: 1, name: "Marketing" },
    { id: 2, name: "Sales" },
    { id: 3, name: "Product" },
  ];

  const mockTags = [
    { id: 1, name: "important" },
    { id: 2, name: "urgent" },
    { id: 3, name: "review" },
  ];

  const mockVideos = [
    { id: 1, title: "How to Market Your Product", channelTitle: "Marketing Pro" },
    { id: 2, title: "Sales Tips for Beginners", channelTitle: "Sales Academy" },
    { id: 3, title: "Product Design Best Practices", channelTitle: "Design Hub" },
  ];

  const mockComments = [
    { id: 1, text: "This is amazing content!" },
    { id: 2, text: "I learned so much from this video" },
    { id: 3, text: "Great marketing tips here" },
  ];

  // Search filter function (simulating the GlobalSearch component logic)
  const searchItems = <T extends Record<string, any>>(
    items: T[],
    query: string,
    fields: (keyof T)[]
  ): T[] => {
    const lowerQuery = query.toLowerCase();
    return items.filter((item) =>
      fields.some((field) => {
        const value = item[field];
        return typeof value === "string" && value.toLowerCase().includes(lowerQuery);
      })
    );
  };

  it("should search projects by name", () => {
    const results = searchItems(mockProjects, "marketing", ["name", "description"]);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Marketing Campaign");
  });

  it("should search projects by description", () => {
    const results = searchItems(mockProjects, "feedback", ["name", "description"]);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Product Launch");
  });

  it("should search folders by name", () => {
    const results = searchItems(mockFolders, "sales", ["name"]);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Sales");
  });

  it("should search tags by name", () => {
    const results = searchItems(mockTags, "urg", ["name"]);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("urgent");
  });

  it("should search videos by title", () => {
    const results = searchItems(mockVideos, "market", ["title", "channelTitle"]);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("How to Market Your Product");
  });

  it("should search videos by channel title", () => {
    const results = searchItems(mockVideos, "academy", ["title", "channelTitle"]);
    expect(results).toHaveLength(1);
    expect(results[0].channelTitle).toBe("Sales Academy");
  });

  it("should search comments by text", () => {
    const results = searchItems(mockComments, "amazing", ["text"]);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("This is amazing content!");
  });

  it("should return empty array for no matches", () => {
    const results = searchItems(mockProjects, "xyz123", ["name", "description"]);
    expect(results).toHaveLength(0);
  });

  it("should be case insensitive", () => {
    const results = searchItems(mockProjects, "MARKETING", ["name", "description"]);
    expect(results).toHaveLength(1);
  });

  it("should match partial words", () => {
    const results = searchItems(mockProjects, "mark", ["name", "description"]);
    expect(results).toHaveLength(1);
  });
});

// Test multi-select logic
describe("Multi-Select", () => {
  const items = [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
    { id: "5" },
  ];

  // Multi-select state management (simulating useMultiSelect hook)
  class MultiSelectState {
    selectedIds: Set<string> = new Set();
    lastSelectedId: string | null = null;

    toggle(id: string) {
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id);
      } else {
        this.selectedIds.add(id);
      }
      this.lastSelectedId = id;
    }

    selectRange(fromId: string, toId: string, allIds: string[]) {
      const fromIndex = allIds.indexOf(fromId);
      const toIndex = allIds.indexOf(toId);
      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);
      
      for (let i = start; i <= end; i++) {
        this.selectedIds.add(allIds[i]);
      }
      this.lastSelectedId = toId;
    }

    selectAll(allIds: string[]) {
      allIds.forEach((id) => this.selectedIds.add(id));
    }

    deselectAll() {
      this.selectedIds.clear();
      this.lastSelectedId = null;
    }

    isSelected(id: string): boolean {
      return this.selectedIds.has(id);
    }

    get selectedCount(): number {
      return this.selectedIds.size;
    }
  }

  it("should toggle single selection", () => {
    const state = new MultiSelectState();
    state.toggle("1");
    expect(state.isSelected("1")).toBe(true);
    expect(state.selectedCount).toBe(1);
    
    state.toggle("1");
    expect(state.isSelected("1")).toBe(false);
    expect(state.selectedCount).toBe(0);
  });

  it("should select multiple items individually", () => {
    const state = new MultiSelectState();
    state.toggle("1");
    state.toggle("3");
    state.toggle("5");
    
    expect(state.isSelected("1")).toBe(true);
    expect(state.isSelected("2")).toBe(false);
    expect(state.isSelected("3")).toBe(true);
    expect(state.isSelected("4")).toBe(false);
    expect(state.isSelected("5")).toBe(true);
    expect(state.selectedCount).toBe(3);
  });

  it("should select range of items (shift+click)", () => {
    const state = new MultiSelectState();
    const allIds = items.map((i) => i.id);
    
    state.toggle("1"); // First click
    state.selectRange("1", "4", allIds); // Shift+click on 4
    
    expect(state.isSelected("1")).toBe(true);
    expect(state.isSelected("2")).toBe(true);
    expect(state.isSelected("3")).toBe(true);
    expect(state.isSelected("4")).toBe(true);
    expect(state.isSelected("5")).toBe(false);
    expect(state.selectedCount).toBe(4);
  });

  it("should select all items", () => {
    const state = new MultiSelectState();
    const allIds = items.map((i) => i.id);
    
    state.selectAll(allIds);
    
    expect(state.selectedCount).toBe(5);
    allIds.forEach((id) => {
      expect(state.isSelected(id)).toBe(true);
    });
  });

  it("should deselect all items", () => {
    const state = new MultiSelectState();
    const allIds = items.map((i) => i.id);
    
    state.selectAll(allIds);
    expect(state.selectedCount).toBe(5);
    
    state.deselectAll();
    expect(state.selectedCount).toBe(0);
  });

  it("should track last selected id", () => {
    const state = new MultiSelectState();
    
    state.toggle("3");
    expect(state.lastSelectedId).toBe("3");
    
    state.toggle("5");
    expect(state.lastSelectedId).toBe("5");
  });
});

// Test folder tree building and drag-and-drop logic
describe("Folder Tree and Drag-Drop", () => {
  interface FolderItem {
    id: number;
    name: string;
    parentFolderId: number | null;
    children?: FolderItem[];
  }

  // Build folder tree from flat list (simulating Sidebar logic)
  const buildFolderTree = (folders: FolderItem[]): FolderItem[] => {
    const map = new Map<number, FolderItem>();
    const roots: FolderItem[] = [];

    folders.forEach((folder) => {
      map.set(folder.id, { ...folder, children: [] });
    });

    folders.forEach((folder) => {
      const node = map.get(folder.id)!;
      if (folder.parentFolderId === null) {
        roots.push(node);
      } else {
        const parent = map.get(folder.parentFolderId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      }
    });

    return roots;
  };

  // Simulate moving a folder to a new parent
  const moveFolder = (
    folders: FolderItem[],
    folderId: number,
    newParentId: number | null
  ): FolderItem[] => {
    return folders.map((folder) =>
      folder.id === folderId
        ? { ...folder, parentFolderId: newParentId }
        : folder
    );
  };

  it("should build folder tree from flat list", () => {
    const flatFolders: FolderItem[] = [
      { id: 1, name: "Marketing", parentFolderId: null },
      { id: 2, name: "Sales", parentFolderId: null },
      { id: 3, name: "Q1 Campaign", parentFolderId: 1 },
      { id: 4, name: "Q2 Campaign", parentFolderId: 1 },
    ];

    const tree = buildFolderTree(flatFolders);
    
    expect(tree).toHaveLength(2); // Two root folders
    expect(tree[0].name).toBe("Marketing");
    expect(tree[0].children).toHaveLength(2); // Two subfolders
    expect(tree[1].name).toBe("Sales");
    expect(tree[1].children).toHaveLength(0);
  });

  it("should handle deeply nested folders", () => {
    const flatFolders: FolderItem[] = [
      { id: 1, name: "Root", parentFolderId: null },
      { id: 2, name: "Level 1", parentFolderId: 1 },
      { id: 3, name: "Level 2", parentFolderId: 2 },
      { id: 4, name: "Level 3", parentFolderId: 3 },
    ];

    const tree = buildFolderTree(flatFolders);
    
    expect(tree).toHaveLength(1);
    expect(tree[0].children![0].children![0].children![0].name).toBe("Level 3");
  });

  it("should move folder to new parent", () => {
    const flatFolders: FolderItem[] = [
      { id: 1, name: "Marketing", parentFolderId: null },
      { id: 2, name: "Sales", parentFolderId: null },
      { id: 3, name: "Campaign", parentFolderId: 1 },
    ];

    // Move "Campaign" from Marketing to Sales
    const updatedFolders = moveFolder(flatFolders, 3, 2);
    const tree = buildFolderTree(updatedFolders);
    
    expect(tree[0].children).toHaveLength(0); // Marketing now empty
    expect(tree[1].children).toHaveLength(1); // Sales has Campaign
    expect(tree[1].children![0].name).toBe("Campaign");
  });

  it("should move folder to root", () => {
    const flatFolders: FolderItem[] = [
      { id: 1, name: "Marketing", parentFolderId: null },
      { id: 2, name: "Campaign", parentFolderId: 1 },
    ];

    // Move "Campaign" to root
    const updatedFolders = moveFolder(flatFolders, 2, null);
    const tree = buildFolderTree(updatedFolders);
    
    expect(tree).toHaveLength(2); // Both at root
    expect(tree[0].children).toHaveLength(0);
  });

  it("should handle empty folder list", () => {
    const tree = buildFolderTree([]);
    expect(tree).toHaveLength(0);
  });
});
