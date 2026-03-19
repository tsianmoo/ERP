package com.productmanagement.repository;

import com.productmanagement.entity.ProductAttributeValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductAttributeValueRepository extends JpaRepository<ProductAttributeValue, Integer> {
    
    List<ProductAttributeValue> findByAttributeIdOrderBySortOrderAsc(Integer attributeId);
    
    @Query("SELECT pav FROM ProductAttributeValue pav ORDER BY pav.sortOrder ASC")
    List<ProductAttributeValue> findAllOrderBySortOrder();
    
    void deleteByAttributeId(Integer attributeId);
}
