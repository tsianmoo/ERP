package com.productmanagement.repository;

import com.productmanagement.entity.SupplierBasicField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierBasicFieldRepository extends JpaRepository<SupplierBasicField, Integer> {
    
    List<SupplierBasicField> findAllByOrderBySortOrderAsc();
}
