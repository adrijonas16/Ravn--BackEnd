import { CaslAbilityFactory } from './casl-ability.factory';

describe('CaslAbilityFactory', () => {
  let factory: CaslAbilityFactory;

  beforeEach(() => {
    factory = new CaslAbilityFactory();
  });

  describe('manager abilities', () => {
    it('should allow manager to manage products', () => {
      const ability = factory.createForUser({
        id: 1,
        email: 'm@t.com',
        role: 'manager',
      });
      expect(ability.can('create', 'Product')).toBe(true);
      expect(ability.can('update', 'Product')).toBe(true);
      expect(ability.can('delete', 'Product')).toBe(true);
    });

    it('should allow manager to read and update orders', () => {
      const ability = factory.createForUser({
        id: 1,
        email: 'm@t.com',
        role: 'manager',
      });
      expect(ability.can('read', 'Order')).toBe(true);
      expect(ability.can('update', 'Order')).toBe(true);
    });

    it('should allow manager to manage promo codes', () => {
      const ability = factory.createForUser({
        id: 1,
        email: 'm@t.com',
        role: 'manager',
      });
      expect(ability.can('manage', 'PromoCode')).toBe(true);
    });

    it('should not allow manager to manage cart', () => {
      const ability = factory.createForUser({
        id: 1,
        email: 'm@t.com',
        role: 'manager',
      });
      expect(ability.can('manage', 'Cart')).toBe(false);
    });
  });

  describe('client abilities', () => {
    it('should allow client to read products', () => {
      const ability = factory.createForUser({
        id: 1,
        email: 'c@t.com',
        role: 'client',
      });
      expect(ability.can('read', 'Product')).toBe(true);
    });

    it('should not allow client to create products', () => {
      const ability = factory.createForUser({
        id: 1,
        email: 'c@t.com',
        role: 'client',
      });
      expect(ability.can('create', 'Product')).toBe(false);
    });

    it('should allow client to manage cart', () => {
      const ability = factory.createForUser({
        id: 1,
        email: 'c@t.com',
        role: 'client',
      });
      expect(ability.can('manage', 'Cart')).toBe(true);
    });

    it('should allow client to create and read orders', () => {
      const ability = factory.createForUser({
        id: 1,
        email: 'c@t.com',
        role: 'client',
      });
      expect(ability.can('create', 'Order')).toBe(true);
      expect(ability.can('read', 'Order')).toBe(true);
    });

    it('should allow client to cancel (delete) orders', () => {
      const ability = factory.createForUser({
        id: 1,
        email: 'c@t.com',
        role: 'client',
      });
      expect(ability.can('delete', 'Order')).toBe(true);
    });

    it('should not allow client to manage promo codes', () => {
      const ability = factory.createForUser({
        id: 1,
        email: 'c@t.com',
        role: 'client',
      });
      expect(ability.can('manage', 'PromoCode')).toBe(false);
    });
  });

  describe('delivery_person abilities', () => {
    it('should allow delivery person to read and update orders', () => {
      const ability = factory.createForUser({
        id: 1,
        email: 'd@t.com',
        role: 'delivery_person',
      });
      expect(ability.can('read', 'Order')).toBe(true);
      expect(ability.can('update', 'Order')).toBe(true);
    });

    it('should not allow delivery person to create orders', () => {
      const ability = factory.createForUser({
        id: 1,
        email: 'd@t.com',
        role: 'delivery_person',
      });
      expect(ability.can('create', 'Order')).toBe(false);
    });

    it('should not allow delivery person to manage products', () => {
      const ability = factory.createForUser({
        id: 1,
        email: 'd@t.com',
        role: 'delivery_person',
      });
      expect(ability.can('manage', 'Product')).toBe(false);
    });
  });
});
