sed -i '/<LiveClassesPlatform activeView/a \
        }\n\n        {(["marketplace", "marketplace-catalog", "marketplace-services", "marketplace-subscriptions", "marketplace-analytics", "marketplace-lars"].includes(view)) \&\& (\n          <MarketplacePlatform activeView={view} setView={setView} />' src/App.tsx
