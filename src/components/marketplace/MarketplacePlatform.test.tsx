import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarketplacePlatform } from "./MarketplacePlatform";
import { marketplaceService } from "../../services/marketplace.service";

vi.mock("../../services/marketplace.service", () => ({ marketplaceService: { catalog: vi.fn(), library: vi.fn(), creatorItems: vi.fn(), createItem: vi.fn(), submitItem: vi.fn(), acquire: vi.fn() } }));
describe("MarketplacePlatform", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });
  it("renders an honest empty catalog without sample products or KPIs", async () => {
    vi.mocked(marketplaceService.catalog).mockResolvedValue([]);
    render(<MarketplacePlatform />);
    expect(await screen.findByText("Nenhum conteúdo publicado")).toBeTruthy();
    expect(screen.queryByText("€ 12,450")).toBeNull();
    expect(screen.queryByText("Advanced Business Vocabulary")).toBeNull();
  });
  it("searches real catalog data and initiates acquisition", async () => {
    vi.mocked(marketplaceService.catalog).mockResolvedValue([{ id: "real-1", title: "Fonética Bantu", description: "Material completo de fonética contrastiva.", itemType: "EBOOK", language: "Português", cefrLevel: "B1", priceCoins: 20, stockQuantity: null, status: "PUBLISHED" }]);
    vi.mocked(marketplaceService.acquire).mockResolvedValue({});
    render(<MarketplacePlatform />); await screen.findByText("Fonética Bantu");
    fireEvent.change(screen.getByPlaceholderText(/Pesquisar/), { target: { value: "Bantu" } });
    fireEvent.click(screen.getByRole("button", { name: /Adquirir por 20/ }));
    await waitFor(() => expect(marketplaceService.acquire).toHaveBeenCalledWith("real-1"));
  });
});
