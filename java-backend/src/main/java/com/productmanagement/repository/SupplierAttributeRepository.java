package com.productmanagement.repository;

import com.productmanagement.entity.SupplierAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierAttributeRepository extends JpaRepository<SupplierAttribute, Integer> {
    
    List<SupplierAttribute> findByEnabledTrueOrderBySortOrderAsc();
    
    List<SupplierAttribute> findByGroupIdOrderBySortOrderAsc(Integer groupId);
    
    List<SupplierAttribute> findByGroupIdIsNullOrderBySortOrderAsc();
    
    @Query("SELECT sa FROM SupplierAttribute sa LEFT JOIN FETCH sa.group ORDER BY sa.sortOrder ASC")
    List<SupplierAttribute> findAllWithGroupOrderBySortOrder();
    
    boolean existsByCode(String code);
}
