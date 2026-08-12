/**
 *  Challenge 5: Get Departments with Product Count
 *
 * Create a function that takes an array of departments and products, and returns a new array of departments with the amount of products available in each department.
 *
 * Requirements:
 * - The function should accept an array of Department objects and an array of Product objects.
 * - Each department should include the quantity of products available in that department.
 * - The department should be idetified just by its name and id other properties should be excluded.
 * - In the information of the department, include the amount of products available in that department and just the name and id of the department.
 * - Add the name of the products in an array called productsNames inside the department object.
 */

import { Department, Product } from "./1-types";

interface DepartmentWithProductCount {
  id: number;
  name: string;
  productCount: number;
  productsNames: string[];
}

async function getDepartmentsWithProductCount(
  departments: Department[],
  products: Product[],
): Promise<DepartmentWithProductCount[]> {
  return departments.map((dept) => {
    const deptProducts = products.filter((p) => p.departmentId === dept.id);
    return {
      id: dept.id,
      name: dept.name,
      productCount: deptProducts.length,
      productsNames: deptProducts.map((p) => p.name),
    };
  });
}
