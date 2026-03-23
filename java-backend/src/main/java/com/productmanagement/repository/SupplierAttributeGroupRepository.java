package com.productmanagement.repository;

import com.productmanagement.entity.SupplierAttributeGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierAttributeGroupRepository extends JpaRepository<SupplierAttributeGroup, Integer> {
    
    List<SupplierAttributeGroup> findAllByOrderBySortOrderAsc();
}
