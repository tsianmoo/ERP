package com.productmanagement.repository;

import com.productmanagement.entity.ProductAttributeValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductAttributeValueRepository extends JpaRepository<ProductAttributeValue, Integer> {
    
    List<ProductAttributeValue> findByAttributeIdOrderBySortOrderAsc(Integer attributeId);
    
    void deleteByAttributeId(Integer attributeId);
}
