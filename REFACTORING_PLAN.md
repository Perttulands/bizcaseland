
src/
├── core/                          # Core infrastructure
│   ├── types/                     # Centralized type system
│   │   ├── index.ts
│   │   ├── common.ts
│   │   ├── business.ts
│   │   └── market.ts
│   ├── contexts/                  # Unified context layer
│   │   ├── DataContext.tsx
│   │   ├── UIContext.tsx
│   │   └── hooks/
│   ├── services/                  # Business logic services
│   │   ├── storage.service.ts
│   │   ├── validation.service.ts
│   │   └── sync.service.ts
│   ├── engine/                    # Calculation engine
│   │   ├── index.ts
│   │   ├── calculators/
│   │   ├── models/
│   │   └── utils/
│   └── registry/                  # Module registry (Phase 4)
├── components/
│   ├── common/                    # Shared feature components
│   ├── features/                  # Feature-specific shared
│   └── ui/                        # shadcn components
├── modules/                       # Feature modules
│   ├── business-case/
│   └── market-analysis/
├── lib/                           # utils
├── hooks/                         # Global hooks
└── pages/                         # Route pages
```

## 🎓 Best Practices Applied

1. ✅ **Single Responsibility Principle**: Each module/service has one job
2. ✅ **Dependency Injection**: Services injected, not imported directly
3. ✅ **Composition over Inheritance**: Reuse through composition
4. ✅ **Type Safety**: Strict TypeScript throughout
5. ✅ **Testability**: Every unit independently testable
6. ✅ **Documentation**: Code is self-documenting with clear naming

## This is not a production version, no need for backward compatability or bandage fixes. 
We do not expect backward compatability. It is ok to break the app for a while. This is a safe branch. 