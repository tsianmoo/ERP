package com.productmanagement.repository;

import com.productmanagement.entity.ProductAttributeGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductAttributeGroupRepository extends JpaRepository<ProductAttributeGroup, Integer> {
    
    List<ProductAttributeGroup> findAllByOrderBySortOrderAsc();
    
    boolean existsByName(String name);
}
