package com.productmanagement.repository;

import com.productmanagement.entity.SupplierCodeRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierCodeRuleRepository extends JpaRepository<SupplierCodeRule, Long> {
    
    List<SupplierCodeRule> findAllByOrderByCreatedAtDesc();
}
