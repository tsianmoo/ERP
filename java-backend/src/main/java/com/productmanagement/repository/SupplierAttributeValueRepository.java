package com.productmanagement.repository;

import com.productmanagement.entity.SupplierAttributeValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierAttributeValueRepository extends JpaRepository<SupplierAttributeValue, Integer> {
    
    List<SupplierAttributeValue> findByAttributeIdOrderBySortOrderAsc(Integer attributeId);
    
    void deleteByAttributeId(Integer attributeId);
}
