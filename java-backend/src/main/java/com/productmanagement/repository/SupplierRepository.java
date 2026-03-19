package com.productmanagement.repository;

import com.productmanagement.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Integer> {
    
    List<Supplier> findByStatusOrderByCreatedAtDesc(String status);
    
    boolean existsBySupplierCode(String supplierCode);
}
