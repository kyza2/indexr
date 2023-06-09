"use client";

import React, { useRef, useState, useEffect, ChangeEvent } from "react";

import Fuse from "fuse.js";

import { debounce } from "@/utils";

interface Item {
  [key: string]: string;
}

const loadItems = async (): Promise<Item[]> => {
  const response = await fetch("/users.json");
  const items = await response.json();

  // Determine the keys (property names) from the JSON items
  const keys = Object.keys(items[0]);

  return items.map((item: Item) => {
    const newItem: Item = {};

    // Copy properties from the item using the determined keys
    keys.forEach((key) => {
      newItem[key] = item[key];
    });

    return newItem;
  });
};

const Search = () => {
  const searchInput = useRef<HTMLInputElement>(null);

  const [names, setNames] = useState<Item[]>([]);
  const [displayedItemsCount, setDisplayedItemsCount] = useState<number>(200);
  const [query, setQuery] = useState<string>("");

  const highlightMatches = ({ item, matches }: any) => {
    let highlightedText = "";
    let lastIndex = 0;

    matches.forEach(({ indices }: any) => {
      indices.forEach(([start, end]: number[]) => {
        const beforeMatch = item.Name.slice(lastIndex, start);
        const matchedText = item.Name.slice(start, end + 1);
        if (matchedText.toLowerCase() === searchInput.current?.value.toLowerCase()) {
          highlightedText += `${beforeMatch}<mark>${matchedText}</mark>`;
          lastIndex = end + 1;
        }
      });

      highlightedText += item.Name.slice(lastIndex);
    });
    return highlightedText;
  };

  const loadMoreItems = () => {
    setDisplayedItemsCount(displayedItemsCount + 100);
  };

  const fuse = useRef<Fuse<Item> | null>(null);

  useEffect(() => {
    fuse.current = new Fuse(names, {
      keys: ["Name"],
      threshold: 0.2,
      includeMatches: true,
    });
  }, [names]);

  const renderNames = () => {
    const results = fuse.current?.search(query) ?? [];
    const renderedResults = [];

    const renderResultItem = (item: Item, result?: Record<string, any>) => {
      return (
        <div id="result">
          {Object.entries(item).map(([key, value]) => (
            <div key={key}>
              <strong>{key}: </strong>
              {key === "Name" && result ? (
                <span dangerouslySetInnerHTML={{ __html: highlightMatches(result) }} />
              ) : (
                <span>{value as string}</span>
              )}
            </div>
          ))}
        </div>
      );
    };

    const renderLoadMore = (count: number) => {
      if (count > displayedItemsCount) {
        return [
          <p key="more">{`${count - displayedItemsCount} more items...`}</p>,
          <button onClick={loadMoreItems} key="load-more">
            Load more
          </button>,
        ];
      }
      return null;
    };

    if (query && query.length >= 2) {
      for (let i = 0; i < Math.min(displayedItemsCount, results.length); i++) {
        const result = results[i];
        const item = result.item;
        renderedResults.push(<div key={i}>{renderResultItem(item, result)}</div>);
      }

      renderedResults.push(renderLoadMore(results.length));
    } else {
      const namesToRender = names.slice(0, displayedItemsCount);

      for (let i = 0; i < namesToRender.length; i++) {
        const name = namesToRender[i];
        renderedResults.push(<div key={i}>{renderResultItem(name)}</div>);
      }

      renderedResults.push(renderLoadMore(names.length));
    }

    return renderedResults;
  };

  useEffect(() => {
    const loadNames = async () => {
      const items = await loadItems();
      setNames(items);
    };
    loadNames();
  }, []);

  const handleInputChange = debounce((event: ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setQuery(query);
  }, 200);

  return (
    <div id="search" className="p-4">
      <h1>Index</h1>
      <input ref={searchInput} type="text" onChange={handleInputChange} />
      <div id="names">{renderNames()}</div>
    </div>
  );
};

export default Search;
